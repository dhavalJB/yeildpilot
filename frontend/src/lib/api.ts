"use client";

import type { SubscriptionId } from "@/lib/subscriptions";
import { beginApi, endApi } from "@/lib/loading-tracker";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  beginApi();
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {})
      },
      cache: "no-store"
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as T;
  } finally {
    endApi();
  }
}

export const api = {
  subscriptions: () => j<{ subscriptions: any[] }>("/subscriptions"),
  yield: (amountTon: number) =>
    j<{ amountTon: number; monthlyYieldUsd: number; apy: number; tonUsd: number }>(
      `/yield?amountTon=${encodeURIComponent(amountTon)}`
    ),
  coverage: (amountTon: number, subscriptionId: SubscriptionId) =>
    j<{
      amountTon: number;
      subscriptionId: SubscriptionId;
      subscriptionCostUsd: number;
      monthlyYieldUsd: number;
      coveragePct: number;
      apy: number;
      tonUsd: number;
    }>(
      `/coverage?amountTon=${encodeURIComponent(amountTon)}&subscriptionId=${encodeURIComponent(subscriptionId)}`
    ),
  market: () => j<{ apy: number; tonUsd: number; tsTonTon: number; source: string }>("/market"),
  walletBalance: (walletAddress: string) =>
    j<{ walletAddress: string; balanceTon: number }>(
      `/wallet/balance?walletAddress=${encodeURIComponent(walletAddress)}`
    ),
  walletStaking: (walletAddress: string, subscriptionId?: SubscriptionId) =>
    j<{
      walletAddress: string;
      stakedAmountTon: number;
      tsTonTon: number;
      monthlyYieldUsd: number;
      coveragePct: number;
      apy: number;
      tonUsd: number;
    }>(
      `/wallet/staking?walletAddress=${encodeURIComponent(walletAddress)}${
        subscriptionId ? `&subscriptionId=${encodeURIComponent(subscriptionId)}` : ""
      }`
    ),
  stakeTx: (body: { amountTon: number; walletAddress: string }) =>
    j<{
      amountTon: number;
      walletAddress: string;
      transaction: {
        validUntil: number;
        messages: Array<{ address: string; amount: string; payload: string }>;
      };
    }>("/stake/tx", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  unstakeTx: (body: { amountTon: number; walletAddress: string }) =>
    j<{
      amountTon: number;
      walletAddress: string;
      transaction: {
        validUntil: number;
        messages: Array<{ address: string; amount: string; payload: string }>;
      };
    }>("/unstake/tx", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  /** STON.fi swap simulation: jetton amount → estimated TON (or pass token "TON" for passthrough). */
  convertTonEstimate: async (body: { amount: number; token: string }) => {
    beginApi();
    try {
      const res = await fetch(`${BACKEND_URL}/convert/ton-estimate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store"
      });
      const data = (await res.json()) as
        | {
            ok: true;
            tonAmount: number;
            usedStonFi: boolean;
            swapRate?: string;
            message?: string;
          }
        | { ok: false; error: string; tonAmount: null; usedStonFi: boolean };
      if (!res.ok) throw new Error("convert_estimate_failed");
      return data;
    } finally {
      endApi();
    }
  }
};

