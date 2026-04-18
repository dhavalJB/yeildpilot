"use client";

import { useEffect, useLayoutEffect } from "react";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { ThemeProvider } from "next-themes";
import { hydrateLocalCachesFromStorage, useAppStore } from "@/lib/store";
import { PreOnboarding } from "@/components/onboarding/pre-onboarding";

export function Providers({
  children,
  tonconnectManifestUrl
}: {
  children: React.ReactNode;
  /** Must match this app’s origin (see /api/tonconnect-manifest). Wrong URL breaks TonConnect. */
  tonconnectManifestUrl: string;
}) {
  const { startMarketPolling } = useAppStore();

  useLayoutEffect(() => {
    hydrateLocalCachesFromStorage();
  }, []);

  useEffect(() => {
    // Telegram Mini App niceties (safe in browser)
    (async () => {
      try {
        const mod = await import("@twa-dev/sdk");
        mod.default.ready();
        mod.default.expand();
      } catch {
        // non-Telegram environment
      }
    })();

    const stopPolling = startMarketPolling();
    return () => {
      stopPolling?.();
    };
  }, [startMarketPolling]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TonConnectUIProvider manifestUrl={tonconnectManifestUrl}>
        {children}
        <PreOnboarding />
      </TonConnectUIProvider>
    </ThemeProvider>
  );
}

