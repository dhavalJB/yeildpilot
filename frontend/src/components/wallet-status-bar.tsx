"use client";

import { useIsConnectionRestored } from "@tonconnect/ui-react";
import { useLoadingActivity } from "@/lib/loading-tracker";
import { Spinner } from "@/components/ui/spinner";

export function WalletStatusBar() {
  const restored = useIsConnectionRestored();

  if (restored) return null;

  return (
    <div className="glass mb-3 rounded-xl border border-white/12 px-4 py-2.5 text-center text-xs font-medium text-muted-foreground shadow-[0_0_32px_rgba(79,140,255,0.08)]">
      Connecting wallet…
    </div>
  );
}

export function ActivityIndicator() {
  const { apiInFlight, marketRefreshing } = useLoadingActivity();
  const active = apiInFlight > 0 || marketRefreshing;
  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-28 right-4 z-[45] flex items-center gap-2 rounded-full border border-white/12 bg-black/55 px-3 py-1.5 text-[10px] font-medium text-muted-foreground shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl"
      title="Updating data"
    >
      <Spinner size="sm" className="text-primary" />
      <span>Updating…</span>
    </div>
  );
}
