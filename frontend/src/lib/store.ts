"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SubscriptionId } from "@/lib/subscriptions";
import { api } from "@/lib/api";
import { setMarketRefreshing } from "@/lib/loading-tracker";
import {
  readMarketCache,
  writeMarketCache,
  readStakeCache,
  writeStakeCache,
  isMarketCacheFresh,
  isStakeCacheFresh
} from "@/lib/local-cache";

type MarketState = {
  apy: number; // decimal
  tonUsd: number;
  tsTonTon: number;
  source: string;
  lastUpdatedAt: number | null;
};

type AppState = {
  walletAddress: string | null;
  balanceTon: number;
  assignedSubscriptionId: SubscriptionId | null;
  market: MarketState;
  solo: { stakeTon: number };
  stakingResult: {
    monthlyYieldUsd: number;
    coveragePct: number;
    status: "idle" | "success" | "error";
    message: string | null;
  };
  balanceSyncing: boolean;
  stakingSyncing: boolean;
  usingCachedMarketData: boolean;
  usingCachedStakeData: boolean;
};

const initial: AppState = {
  walletAddress: null,
  balanceTon: 0,
  assignedSubscriptionId: null,
  market: {
    apy: 0.2408,
    tonUsd: 1,
    tsTonTon: 1,
    source: "boot",
    lastUpdatedAt: null
  },
  solo: { stakeTon: 0 },
  stakingResult: {
    monthlyYieldUsd: 0,
    coveragePct: 0,
    status: "idle",
    message: null
  },
  balanceSyncing: false,
  stakingSyncing: false,
  usingCachedMarketData: false,
  usingCachedStakeData: false
};

let globalState: AppState = initial;
const listeners = new Set<(s: AppState) => void>();
let marketPollingRunning = false;
let marketPollingTimer: ReturnType<typeof setTimeout> | null = null;
let marketTickPromise: Promise<void> | null = null;
let balanceRefreshPromise: Promise<void> | null = null;
const stakeRefreshPromises = new Map<string, Promise<void>>();

function emit() {
  for (const l of listeners) l(globalState);
}

function applyMarketFromCache(cached: NonNullable<ReturnType<typeof readMarketCache>>) {
  globalState = {
    ...globalState,
    market: {
      apy: cached.apy,
      tonUsd: cached.tonPrice,
      tsTonTon: cached.tsTonTon,
      source: cached.source,
      lastUpdatedAt: cached.timestamp
    }
  };
}

/** Call once on client before paint to show cached market instantly (no SSR mismatch: runs only in browser). */
export function hydrateLocalCachesFromStorage(): void {
  if (typeof window === "undefined") return;
  const cached = readMarketCache();
  if (!cached) return;
  applyMarketFromCache(cached);
  globalState = { ...globalState, usingCachedMarketData: false };
  emit();
}

export function useAppStore() {
  const [state, setState] = useState<AppState>(() => globalState);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  const setAssignedSubscription = useCallback((id: string) => {
    globalState = { ...globalState, assignedSubscriptionId: id as SubscriptionId };
    emit();
  }, []);

  const setSoloStakeTon = useCallback((stakeTon: number) => {
    globalState = { ...globalState, solo: { stakeTon } };
    emit();
  }, []);

  const setWalletAddress = useCallback((walletAddress: string | null) => {
    globalState = { ...globalState, walletAddress };
    emit();
  }, []);

  const refreshWalletBalance = useCallback(async (walletAddress: string | null) => {
    if (!walletAddress) {
      globalState = { ...globalState, balanceTon: 0, balanceSyncing: false };
      emit();
      return;
    }
    if (balanceRefreshPromise) {
      await balanceRefreshPromise;
      return;
    }
    balanceRefreshPromise = (async () => {
      globalState = { ...globalState, balanceSyncing: true };
      emit();
      try {
        const { balanceTon } = await api.walletBalance(walletAddress);
        globalState = { ...globalState, balanceTon, balanceSyncing: false };
        emit();
      } catch {
        globalState = { ...globalState, balanceSyncing: false };
        emit();
      }
    })().finally(() => {
      balanceRefreshPromise = null;
    });
    await balanceRefreshPromise;
  }, []);

  const refreshOnchainStake = useCallback(
    async (walletAddress: string | null, subscriptionId?: SubscriptionId | null) => {
      if (!walletAddress) {
        globalState = {
          ...globalState,
          solo: { stakeTon: 0 },
          stakingSyncing: false,
          stakingResult: {
            monthlyYieldUsd: 0,
            coveragePct: 0,
            status: "idle",
            message: null
          },
          usingCachedStakeData: false
        };
        emit();
        return;
      }

      const sub = (subscriptionId ?? globalState.assignedSubscriptionId ?? "netflix") as SubscriptionId;
      const inflightKey = `${walletAddress}:${sub}`;
      const existing = stakeRefreshPromises.get(inflightKey);
      if (existing) {
        await existing;
        return;
      }

      const run = (async () => {
        const cached = readStakeCache(walletAddress);
        if (
          cached &&
          cached.subscriptionId === sub &&
          isStakeCacheFresh(cached)
        ) {
          globalState = {
            ...globalState,
            solo: { stakeTon: cached.stakedAmount },
            stakingSyncing: false,
            stakingResult: {
              monthlyYieldUsd: cached.monthlyYieldUsd,
              coveragePct: cached.coveragePct,
              status: "success",
              message: null
            },
            usingCachedStakeData: false
          };
          emit();
          return;
        }

        globalState = { ...globalState, stakingSyncing: true };
        emit();

        try {
          const snapshot = await api.walletStaking(walletAddress, sub);
          writeStakeCache(walletAddress, sub, {
            stakedAmount: snapshot.stakedAmountTon,
            monthlyYieldUsd: snapshot.monthlyYieldUsd,
            coveragePct: snapshot.coveragePct
          });
          globalState = {
            ...globalState,
            solo: { stakeTon: snapshot.stakedAmountTon },
            stakingSyncing: false,
            stakingResult: {
              monthlyYieldUsd: snapshot.monthlyYieldUsd,
              coveragePct: snapshot.coveragePct,
              status: "success",
              message: null
            },
            usingCachedStakeData: false
          };
          emit();
        } catch {
          const fallback = readStakeCache(walletAddress);
          if (fallback && fallback.subscriptionId === sub) {
            globalState = {
              ...globalState,
              solo: { stakeTon: fallback.stakedAmount },
              stakingSyncing: false,
              stakingResult: {
                monthlyYieldUsd: fallback.monthlyYieldUsd,
                coveragePct: fallback.coveragePct,
                status: "success",
                message: null
              },
              usingCachedStakeData: true
            };
          } else {
            globalState = { ...globalState, stakingSyncing: false };
          }
          emit();
        }
      })().finally(() => {
        stakeRefreshPromises.delete(inflightKey);
      });

      stakeRefreshPromises.set(inflightKey, run);
      await run;
    },
    []
  );

  const setStakingResult = useCallback(
    (result: {
      monthlyYieldUsd: number;
      coveragePct: number;
      status: "idle" | "success" | "error";
      message: string | null;
    }) => {
      globalState = { ...globalState, stakingResult: result };
      emit();
    },
    []
  );

  const startMarketPolling = useCallback(() => {
    if (marketPollingRunning) {
      return () => undefined;
    }
    marketPollingRunning = true;
    let stopped = false;

    const runMarketTickOnce = async () => {
      if (marketTickPromise) {
        await marketTickPromise;
        return;
      }

      marketTickPromise = (async () => {
        const now = Date.now();
        const cached = readMarketCache();

        if (cached && isMarketCacheFresh(cached, now)) {
          applyMarketFromCache(cached);
          globalState = { ...globalState, usingCachedMarketData: false };
          emit();
          return;
        }

        setMarketRefreshing(true);
        try {
          const m = await api.market();
          writeMarketCache({
            apy: m.apy,
            tonPrice: m.tonUsd,
            tsTonTon: m.tsTonTon,
            source: m.source
          });
          globalState = {
            ...globalState,
            market: {
              apy: m.apy,
              tonUsd: m.tonUsd,
              tsTonTon: m.tsTonTon,
              source: m.source,
              lastUpdatedAt: Date.now()
            },
            usingCachedMarketData: false
          };
          emit();
        } catch {
          if (cached) {
            applyMarketFromCache(cached);
            globalState = { ...globalState, usingCachedMarketData: true };
            emit();
          }
        } finally {
          setMarketRefreshing(false);
        }
      })().finally(() => {
        marketTickPromise = null;
      });

      await marketTickPromise;
    };

    const tick = async () => {
      await runMarketTickOnce();
      if (!stopped) {
        marketPollingTimer = setTimeout(tick, 10000);
      }
    };
    tick();
    return () => {
      stopped = true;
      marketPollingRunning = false;
      if (marketPollingTimer) {
        clearTimeout(marketPollingTimer);
        marketPollingTimer = null;
      }
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      setAssignedSubscription,
      setSoloStakeTon,
      setWalletAddress,
      refreshWalletBalance,
      refreshOnchainStake,
      setStakingResult,
      startMarketPolling
    }),
    [
      state,
      setAssignedSubscription,
      setSoloStakeTon,
      setWalletAddress,
      refreshWalletBalance,
      refreshOnchainStake,
      setStakingResult,
      startMarketPolling
    ]
  );
}
