"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Moon, Sun, TrendingUp, Wallet } from "lucide-react";
import { TonConnectButton, useTonWallet } from "@tonconnect/ui-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useAppStore } from "@/lib/store";
import { ActivityIndicator, WalletStatusBar } from "@/components/wallet-status-bar";
import { hapticTap } from "@/lib/telegram-haptics";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();
  /** Avoid theme flash + hydration mismatch: SSR and first paint match `defaultTheme="dark"`. */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = !mounted ? true : resolvedTheme !== "light";
  const wallet = useTonWallet();
  const { setWalletAddress, refreshWalletBalance, refreshOnchainStake } = useAppStore();

  useEffect(() => {
    const addr = wallet?.account?.address ?? null;
    setWalletAddress(addr);
    refreshWalletBalance(addr);
    refreshOnchainStake(addr);

    if (!addr) return;
    const id = setInterval(() => {
      refreshWalletBalance(addr);
      refreshOnchainStake(addr);
    }, 10000);
    return () => clearInterval(id);
  }, [setWalletAddress, refreshWalletBalance, refreshOnchainStake, wallet?.account?.address]);

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "relative min-h-dvh",
        isDark ? "fintech-bg" : "light-fintech-bg light"
      )}
    >
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-28 pt-5">
        <header className="sticky top-0 z-40">
          <div className="glass premium-card flex items-center justify-between rounded-2xl px-5 py-3.5">
            <div className="flex items-center gap-2">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
                <Wallet className="size-5 text-ton-400" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">YieldPay</div>
                <div className="text-[11px] text-muted-foreground">
                  TON • Telegram Mini App
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  hapticTap();
                  setTheme(isDark ? "light" : "dark");
                }}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <div className="rounded-xl">
                {mounted ? (
                  <TonConnectButton />
                ) : (
                  <div
                    className="h-10 min-w-[10rem] rounded-xl border border-slate-200/80 bg-slate-100/80 dark:border-white/10 dark:bg-white/5"
                    aria-hidden
                  />
                )}
              </div>
            </div>
          </div>
        </header>

        <WalletStatusBar />

        <main className="mt-5 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <ActivityIndicator />

        <nav className="fixed bottom-0 left-0 right-0 z-50">
          <div className="mx-auto w-full max-w-md px-4 pb-4">
            <div className="glass premium-card grid grid-cols-2 gap-2 rounded-2xl p-2">
              <NavItem href="/" label="Dashboard" active={pathname === "/"} icon={<Home className="size-5" />} />
              <NavItem
                href="/solo"
                label="Invest"
                active={pathname.startsWith("/solo")}
                icon={<TrendingUp className="size-5" />}
              />
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  active,
  icon
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => hapticTap()}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        active
          ? "border border-primary/25 bg-white text-foreground shadow-md shadow-primary/10 dark:border-white/12 dark:bg-white/12 dark:shadow-[0_0_24px_rgba(79,140,255,0.12)]"
          : "border border-transparent text-muted-foreground hover:-translate-y-0.5 hover:bg-white/80 hover:text-foreground dark:hover:bg-white/10"
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

