import { NextRequest, NextResponse } from "next/server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept"
} as const;

/** TonConnect fetches this URL; `url` must match the tab origin or wallets report “manifest load failed”. */
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors });
}

/**
 * Served at `/api/tonconnect-manifest` (and via rewrite from `/tonconnect-manifest.json`).
 * Use the API path in TonConnect — avoids rewrite edge cases in some WebViews.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const manifestPath = `${origin}/api/tonconnect-manifest`;

  const body = {
    url: origin,
    name: "YieldPay",
    iconUrl: `${origin}/icon.svg`,
    dappUrl: `${origin}/`,
    manifestUrl: manifestPath
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...cors
    }
  });
}
