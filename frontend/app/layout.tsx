import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell/app-shell";

export const metadata: Metadata = {
  title: "YieldPay",
  description: "Telegram Mini App on TON — YieldPay"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${proto}://${host}`;

  /**
   * Always same-origin manifest so `url` in JSON matches the app (TonConnect rejects mismatches → “manifest load failed”).
   * Optional remote URL in env is easy to get wrong; use `/api/tonconnect-manifest` only unless you know the remote `url` matches this deployment.
   */
  const envManifest = process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL?.trim();
  const tonconnectManifestUrl =
    envManifest && envManifest.length > 0
      ? envManifest
      : `${origin}/api/tonconnect-manifest`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers tonconnectManifestUrl={tonconnectManifestUrl}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}

