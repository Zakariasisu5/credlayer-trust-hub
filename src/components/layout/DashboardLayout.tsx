import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Search,
  Brain,
  Trophy,
  Code2,
  Settings,
  Shield,
  Menu,
  KeyRound,
  BadgeCheck,
  Activity,
} from "lucide-react";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import iconUrl from "@/assets/icon.webp";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/analyzer", label: "Analyzer", icon: Search },
  { to: "/dashboard/intelligence", label: "AI Risk Intelligence", icon: Brain },
  { to: "/dashboard/permissions", label: "Permissions", icon: KeyRound },
  { to: "/dashboard/credentials", label: "Credentials", icon: BadgeCheck },
  { to: "/dashboard/activity", label: "Activity Logs", icon: Activity },
  { to: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/dashboard/developer", label: "Developer", icon: Code2 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function DashboardLayout() {
  const { connected, connecting, disconnecting, wallet } = useWallet();
  const navigate = useNavigate();

  // Grace period prevents bouncing to "/" during expected transient
  // disconnects: switching wallets, page-tab regaining focus, autoConnect
  // re-hydrating from localStorage. We only redirect if the wallet is still
  // not connected after a short window.
  const [graceElapsed, setGraceElapsed] = useState(false);
  const everConnected = useRef(false);

  useEffect(() => {
    if (connected) everConnected.current = true;
  }, [connected]);

  useEffect(() => {
    const t = setTimeout(() => setGraceElapsed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (connected || connecting || disconnecting) return;
    // If wallet adapter is mid-handshake (wallet selected, not yet connected)
    // give it time to finish.
    if (wallet && !graceElapsed) return;
    if (!graceElapsed) return;
    navigate({ to: "/" });
  }, [connected, connecting, disconnecting, wallet, graceElapsed, navigate]);

  if (!connected) {
    // While reconnecting / autoConnecting, show a neutral loading state
    // instead of immediately demanding a fresh connection.
    if (connecting || disconnecting || (wallet && !graceElapsed)) {
      return (
        <div className="min-h-screen grid place-items-center px-4">
          <div className="text-center max-w-sm">
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <p className="mt-4 text-sm text-muted-foreground">Reconnecting wallet…</p>
          </div>
        </div>
      );
    }

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
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar fixed left-0 top-0 bottom-0 z-40">
        <SidebarInner />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:ml-64">
        <header className="h-16 border-b border-border/60 flex items-center justify-between px-4 md:px-6 bg-background/60 backdrop-blur-md fixed top-0 right-0 left-0 md:left-64 z-30">
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
        <main className="flex-1 p-4 md:p-8 mt-16">
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
        <img src={iconUrl} alt="CredLayer" className="h-8 w-8" />
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
