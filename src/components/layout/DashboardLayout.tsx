import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Search,
  Brain,
  Trophy,
  Code2,
  Settings,
  Shield,
  Menu,
} from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/analyzer", label: "Analyzer", icon: Search },
  { to: "/dashboard/intelligence", label: "AI Risk Intelligence", icon: Brain },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard/developer", label: "Developer", icon: Code2 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardLayout() {
  const { connected, connecting } = useWallet();
  const navigate = useNavigate();

  // Wallet gate
  useEffect(() => {
    if (!connecting && !connected) {
      navigate({ to: "/" });
    }
  }, [connected, connecting, navigate]);

  if (!connected) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="text-center max-w-sm">
          <Shield className="h-10 w-10 text-primary mx-auto" />
          <h2 className="mt-4 text-xl font-semibold">Connect wallet to continue</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            CredLayer is wallet-gated. Connect Phantom, Solflare, or Backpack to access your dashboard.
          </p>
          <div className="mt-6 flex justify-center">
            <ConnectWalletButton size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar">
        <SidebarInner />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:px-6 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-sidebar">
                <SidebarInner />
              </SheetContent>
            </Sheet>
            <PageTitle />
          </div>
          <ConnectWalletButton />
        </header>
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarInner() {
  const router = useRouterState();
  const path = router.location.pathname;
  return (
    <>
      <Link to="/" className="flex items-center gap-2 h-16 px-5 border-b border-border/60">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[oklch(0.84_0.17_92)] to-[oklch(0.72_0.2_240)] grid place-items-center">
          <Shield className="h-4 w-4 text-background" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          <span className="text-gradient-gold">Cred</span>
          <span className="text-gradient-electric">Layer</span>
        </span>
      </Link>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const active =
            item.to === "/dashboard"
              ? path === "/dashboard"
              : path.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground border border-border/60"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 text-xs text-muted-foreground border-t border-border/60">
        v1.0 · Solana mainnet
      </div>
    </>
  );
}

function PageTitle() {
  const router = useRouterState();
  const path = router.location.pathname;
  const item = NAV.find((n) =>
    n.to === "/dashboard" ? path === "/dashboard" : path.startsWith(n.to)
  );
  return <h1 className="text-base md:text-lg font-semibold">{item?.label ?? "CredLayer"}</h1>;
}
