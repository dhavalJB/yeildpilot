"use client";

import type { SubscriptionId } from "@/lib/subscriptions";

const MARKET_KEY = "market_data";
const STAKE_KEY = "user_stake_data";

export const MARKET_CACHE_TTL_MS = 10_000;
export const STAKE_CACHE_TTL_MS = 15_000;

export type MarketCachePayload = {
  apy: number;
  tonPrice: number;
  tsTonTon: number;
  source: string;
  timestamp: number;
};

/** Normalized stake cache (file uses key `"yield"` for monthly yield USD). */
export type StakeCacheEntry = {
  walletAddress: string;
  subscriptionId: SubscriptionId;
  stakedAmount: number;
  monthlyYieldUsd: number;
  coveragePct: number;
  timestamp: number;
};

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function readMarketCache(): MarketCachePayload | null {
  if (typeof window === "undefined") return null;
  try {
    const v = safeParse<MarketCachePayload>(localStorage.getItem(MARKET_KEY));
    if (!v || typeof v.timestamp !== "number") return null;
    if (!Number.isFinite(v.apy) || !Number.isFinite(v.tonPrice)) return null;
    return v;
  } catch {
    return null;
  }
}

export function writeMarketCache(payload: Omit<MarketCachePayload, "timestamp">): void {
  if (typeof window === "undefined") return;
  try {
    const entry: MarketCachePayload = { ...payload, timestamp: Date.now() };
    localStorage.setItem(MARKET_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / private mode
  }
}

export function readStakeCache(walletAddress: string): StakeCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = safeParse<Record<string, unknown>>(localStorage.getItem(STAKE_KEY));
    if (!raw || raw.walletAddress !== walletAddress) return null;
    if (typeof raw.timestamp !== "number") return null;
    const subId = raw.subscriptionId as SubscriptionId;
    const staked = Number(raw.stakedAmount);
    const y =
      typeof raw.yield === "number"
        ? raw.yield
        : typeof raw.monthlyYieldUsd === "number"
          ? raw.monthlyYieldUsd
          : NaN;
    const cov =
      typeof raw.coverage === "number"
        ? raw.coverage
        : typeof raw.coveragePct === "number"
          ? raw.coveragePct
          : NaN;
    if (!Number.isFinite(staked) || !Number.isFinite(y) || !Number.isFinite(cov)) return null;
    return {
      walletAddress,
      subscriptionId: subId,
      stakedAmount: staked,
      monthlyYieldUsd: y,
      coveragePct: cov,
      timestamp: raw.timestamp
    };
  } catch {
    return null;
  }
}

export function writeStakeCache(
  walletAddress: string,
  subscriptionId: SubscriptionId,
  data: { stakedAmount: number; monthlyYieldUsd: number; coveragePct: number }
): void {
  if (typeof window === "undefined") return;
  try {
    const entry = {
      walletAddress,
      subscriptionId,
      stakedAmount: data.stakedAmount,
      yield: data.monthlyYieldUsd,
      coverage: data.coveragePct,
      timestamp: Date.now()
    };
    localStorage.setItem(STAKE_KEY, JSON.stringify(entry));
  } catch {
    // ignore
  }
}

export function isMarketCacheFresh(entry: MarketCachePayload, now = Date.now()): boolean {
  return now - entry.timestamp < MARKET_CACHE_TTL_MS;
}

export function isStakeCacheFresh(entry: StakeCacheEntry, now = Date.now()): boolean {
  return now - entry.timestamp < STAKE_CACHE_TTL_MS;
}
