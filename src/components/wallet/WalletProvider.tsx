import { useCallback, useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { WalletError } from "@solana/wallet-adapter-base";
import { SOLANA_RPC_URL } from "@/lib/credlayer-config";
import { toast } from "sonner";
import "@/wallet-adapter-react-ui.css";

export function CredLayerWalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  // Wallet-Standard wallets (Phantom, Solflare, Backpack, MetaMask via the
  // Solana Snap, etc.) are auto-discovered and merged into this list. The
  // explicit adapters here serve as a fallback for older browsers; the modal
  // will mark them as "Not Detected" when not installed so users aren't misled.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
    ],
    []
  );

  const onError = useCallback((error: WalletError) => {
    // User-cancelled and "wallet not ready" are noisy; suppress them.
    const name = error?.name ?? "";
    const msg = error?.message ?? "Wallet error";
    if (
      name === "WalletNotReadyError" ||
      /User rejected|Cancel/i.test(msg)
    ) {
      return;
    }
    console.error("[wallet]", error);
    toast.error("Wallet error", { description: msg });
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

