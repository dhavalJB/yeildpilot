"use client";

import { useSyncExternalStore } from "react";

type LoadingSnapshot = {
  apiInFlight: number;
  marketRefreshing: boolean;
};

let apiInFlight = 0;
let marketRefreshing = false;
const listeners = new Set<() => void>();

function notify() {
  for (const l of listeners) l();
}

export function beginApi(): void {
  apiInFlight += 1;
  notify();
}

export function endApi(): void {
  apiInFlight = Math.max(0, apiInFlight - 1);
  notify();
}

export function setMarketRefreshing(value: boolean): void {
  if (marketRefreshing === value) return;
  marketRefreshing = value;
  notify();
}

/** Stable snapshot for SSR; must be the same reference across getServerSnapshot calls. */
const SERVER_SNAPSHOT: LoadingSnapshot = { apiInFlight: 0, marketRefreshing: false };

let clientSnapshotCache: LoadingSnapshot = { apiInFlight: 0, marketRefreshing: false };

function getSnapshot(): LoadingSnapshot {
  if (
    clientSnapshotCache.apiInFlight !== apiInFlight ||
    clientSnapshotCache.marketRefreshing !== marketRefreshing
  ) {
    clientSnapshotCache = { apiInFlight, marketRefreshing };
  }
  return clientSnapshotCache;
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getServerSnapshot(): LoadingSnapshot {
  return SERVER_SNAPSHOT;
}

export function useLoadingActivity(): LoadingSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function isNetworkBusy(): boolean {
  return apiInFlight > 0 || marketRefreshing;
}
