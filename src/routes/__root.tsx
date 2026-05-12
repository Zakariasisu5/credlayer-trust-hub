import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { CredLayerWalletProvider } from "@/components/wallet/WalletProvider";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-gold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CredLayer — On-chain Reputation & Trust Scoring on Solana" },
      {
        name: "description",
        content:
          "CredLayer is a decentralized reputation protocol on Solana. Real-time wallet trust scores and AI risk intelligence for DeFi and AI agents.",
      },
      { property: "og:title", content: "CredLayer — On-chain Reputation & Trust Scoring on Solana" },
      {
        property: "og:description",
        content: "AI-powered wallet trust scores and risk detection for the Solana ecosystem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CredLayer — On-chain Reputation & Trust Scoring on Solana" },
      { name: "description", content: "A Web3 dashboard for analyzing wallet reputation and AI agent trust scores on Solana." },
      { property: "og:description", content: "A Web3 dashboard for analyzing wallet reputation and AI agent trust scores on Solana." },
      { name: "twitter:description", content: "A Web3 dashboard for analyzing wallet reputation and AI agent trust scores on Solana." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b11093ac-3682-45d2-93df-715d5a50a559/id-preview-02c44e4e--d7507027-2be2-45ad-8d65-2ce73d2d742f.lovable.app-1778596467951.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b11093ac-3682-45d2-93df-715d5a50a559/id-preview-02c44e4e--d7507027-2be2-45ad-8d65-2ce73d2d742f.lovable.app-1778596467951.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <CredLayerWalletProvider>
        <Outlet />
        <Toaster />
      </CredLayerWalletProvider>
    </QueryClientProvider>
  );
}
