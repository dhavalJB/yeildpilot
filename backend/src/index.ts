import "dotenv/config";
import express from "express";
import cors from "cors";
import { z } from "zod";
import * as TonstakersSdk from "tonstakers-sdk";
import { Address, fromNano, toNano } from "@ton/core";
import type { NextFunction, Request, Response } from "express";
import { convertToTON } from "./stonfi-convert";

const Tonstakers: any =
  (TonstakersSdk as any).Tonstakers ?? (TonstakersSdk as any).default?.Tonstakers;

const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";
const TONAPI_MIN_INTERVAL_MS = 1000;
const TONAPI_RETRY_DELAY_MS = 2500;
const BALANCE_CACHE_TTL_MS = 10_000;

type SubscriptionId = "netflix" | "spotify" | "amazon" | "telegram_premium";

const SUBSCRIPTIONS: Array<{
  id: SubscriptionId;
  name: string;
  monthlyUsd: number;
}> = [
  { id: "netflix", name: "Netflix Premium", monthlyUsd: 26 },
  { id: "spotify", name: "Spotify", monthlyUsd: 11.99 },
  { id: "amazon", name: "Amazon Prime", monthlyUsd: 14.99 },
  { id: "telegram_premium", name: "Telegram Premium", monthlyUsd: 4.99 }
];

const memory = {
  squads: new Map<
    string,
    {
      id: string;
      subscriptionId: SubscriptionId;
      members: Array<{ id: string; name: string; contributionTon: number }>;
    }
  >()
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

type TonTxMessage = {
  address: string;
  amount: string;
  payload: string;
};

type TonTx = {
  validUntil: number;
  messages: TonTxMessage[];
};

let tonApiQueue: Promise<void> = Promise.resolve();
let lastTonApiCallAt = 0;

async function runWithTonApiRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  let releaseQueue!: () => void;
  const nextTurn = new Promise<void>((resolve) => {
    releaseQueue = resolve;
  });
  const waitPrev = tonApiQueue;
  tonApiQueue = waitPrev.then(() => nextTurn);

  await waitPrev;
  const now = Date.now();
  const waitMs = Math.max(0, TONAPI_MIN_INTERVAL_MS - (now - lastTonApiCallAt));
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  try {
    const result = await fn();
    lastTonApiCallAt = Date.now();
    return result;
  } finally {
    releaseQueue();
  }
}

function isRateLimitError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return msg.includes("429") || msg.includes("too many requests");
}

async function withRetryOn429<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, TONAPI_RETRY_DELAY_MS));
    }
  }
  throw lastError;
}

type MarketSnapshot = {
  apy: number;
  tonUsd: number;
  tsTonTon: number;
  source: string;
};
let marketCache: { data: MarketSnapshot; cachedAt: number } | null = null;
const STAKING_CACHE_TTL_MS = 20_000;
const stakingCache = new Map<string, { stakedAmountTon: number; cachedAt: number }>();
const balanceCache = new Map<string, { balanceTon: number; cachedAt: number }>();

function normalizeTonFromNano(rawValue: unknown, label: string): number {
  let nano: bigint;
  try {
    nano = BigInt(rawValue as any);
  } catch {
    console.log(`[debug] ${label}: invalid raw value`, rawValue);
    return 0;
  }

  const ton = Number(fromNano(nano));
  const safeTon = Number.isFinite(ton) && ton > 0 ? ton : 0;
  const clampedTon = safeTon > 10_000 ? 0 : safeTon;

  console.log(
    `[debug] ${label}: raw=${nano.toString()} converted_ton=${safeTon} final_ton=${clampedTon}`
  );
  return clampedTon;
}

async function buildStakeTransaction(amountTon: number, walletAddress: string): Promise<TonTx> {
  let built: TonTx | null = null;
  const connector = {
    onStatusChange: (callback: (wallet: any) => void) => {
      callback({ account: { address: walletAddress } });
      return () => undefined;
    },
    sendTransaction: async (transaction: TonTx) => {
      built = transaction;
      return { boc: "prepared-by-backend" };
    }
  };

  const tonstakers = new Tonstakers({
    connector,
    tonApiKey: process.env.TON_API_KEY || undefined
  });

  for (let i = 0; i < 20 && !tonstakers.ready; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!tonstakers.ready) throw new Error("Tonstakers initialization timed out.");

  await tonstakers.stake(toNano(amountTon.toString()));
  if (!built) throw new Error("failed to build stake transaction");
  return built;
}

async function buildUnstakeTransaction(amountTon: number, walletAddress: string): Promise<TonTx> {
  let built: TonTx | null = null;
  const connector = {
    onStatusChange: (callback: (wallet: any) => void) => {
      callback({ account: { address: walletAddress } });
      return () => undefined;
    },
    sendTransaction: async (transaction: TonTx) => {
      built = transaction;
      return { boc: "prepared-by-backend" };
    }
  };

  const tonstakers = new Tonstakers({
    connector,
    tonApiKey: process.env.TON_API_KEY || undefined
  });

  for (let i = 0; i < 20 && !tonstakers.ready; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!tonstakers.ready) throw new Error("Tonstakers initialization timed out.");

  await tonstakers.unstake(toNano(amountTon.toString()));
  if (!built) throw new Error("failed to build unstake transaction");
  return built;
}

async function getOnchainStakedTon(walletAddress: string): Promise<number> {
  const cached = stakingCache.get(walletAddress);
  if (cached && Date.now() - cached.cachedAt < STAKING_CACHE_TTL_MS) {
    return cached.stakedAmountTon;
  }

  const connector = {
    onStatusChange: (callback: (wallet: any) => void) => {
      callback({ account: { address: walletAddress } });
      return () => undefined;
    },
    sendTransaction: async () => ({ boc: "not-used" })
  };

  const tonstakers = new Tonstakers({
    connector,
    tonApiKey: process.env.TON_API_KEY || undefined
  });

  for (let i = 0; i < 20 && !tonstakers.ready; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!tonstakers.ready) throw new Error("Tonstakers initialization timed out.");

  const rawStaked = await withRetryOn429(() =>
    runWithTonApiRateLimit(() => tonstakers.getStakedBalance().catch(() => 0))
  );
  const stakedAmountTon = normalizeTonFromNano(rawStaked, "wallet_staked_balance");
  stakingCache.set(walletAddress, { stakedAmountTon, cachedAt: Date.now() });
  return stakedAmountTon;
}

async function getMarket() {
  if (marketCache && Date.now() - marketCache.cachedAt < 15_000) {
    return marketCache.data;
  }

  const tonApiKey = process.env.TON_API_KEY || undefined;
  let apyPct: number = 24.08;
  let rates: any = { TONUSD: 1, tsTONTON: 1 };

  // Only hit Tonstakers SDK when key is configured; otherwise use stable fallback.
  // This avoids repeated SDK error logs in local/dev environments.
  if (tonApiKey) {
    const stubConnector: any = {
      onStatusChange: () => undefined,
      sendTransaction: async () => {
        throw new Error("not supported");
      }
    };
    const tonstakers = new Tonstakers({
      connector: stubConnector,
      tonApiKey
    });
    apyPct = await withRetryOn429(() =>
      runWithTonApiRateLimit(() => tonstakers.getCurrentApy().catch(() => 24.08))
    );
    rates = await withRetryOn429(() =>
      runWithTonApiRateLimit(() =>
        tonstakers.getRates().catch(() => ({ TONUSD: 1, tsTONTON: 1 }))
      )
    );
  }

  // Prefer STON.fi TON/USDT if possible; fall back to Tonstakers TONUSD.
  const stonfiTonUsd = await fetchStonfiTonUsd().catch(() => null);

  const apy = Number(apyPct) / 100;
  const tonUsdFallback = Number(rates?.TONUSD);
  const tonUsd =
    stonfiTonUsd ??
    (Number.isFinite(tonUsdFallback) && tonUsdFallback > 0 ? tonUsdFallback : 0);

  const tsTonTon = Number(rates?.tsTONTON);

  const snapshot: MarketSnapshot = {
    apy: Number.isFinite(apy) && apy > 0 ? apy : 0.2408,
    tonUsd: Number.isFinite(tonUsd) && tonUsd > 0 ? tonUsd : 1,
    tsTonTon: Number.isFinite(tsTonTon) && tsTonTon > 0 ? tsTonTon : 1,
    source: stonfiTonUsd ? "stonfi" : "tonstakers"
  };
  marketCache = { data: snapshot, cachedAt: Date.now() };
  return snapshot;
}

async function fetchStonfiTonUsd(): Promise<number | null> {
  const res = await fetch("https://api.ston.fi/v1/markets", {
    headers: { accept: "application/json" }
  });
  if (!res.ok) return null;
  const json = (await res.json()) as any;
  const items: any[] =
    Array.isArray(json) ? json : Array.isArray(json?.markets) ? json.markets : Array.isArray(json?.data) ? json.data : [];

  const pick = items.find((m) => {
    const base = (m?.baseSymbol ?? m?.base?.symbol ?? m?.base_asset?.symbol ?? "").toString().toUpperCase();
    const quote = (m?.quoteSymbol ?? m?.quote?.symbol ?? m?.quote_asset?.symbol ?? "").toString().toUpperCase();
    return base === "TON" && quote === "USDT";
  });
  if (!pick) return null;

  const price =
    Number(pick?.price) ||
    Number(pick?.lastPrice) ||
    Number(pick?.last_price) ||
    Number(pick?.midPrice) ||
    Number(pick?.mid_price);
  return Number.isFinite(price) && price > 0 ? price : null;
}

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/subscriptions", (_req, res) => {
  res.json({ subscriptions: SUBSCRIPTIONS });
});

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}

app.get("/market", asyncRoute(async (_req, res) => {
  const m = await getMarket();
  res.json(m);
}));

app.get("/yield", asyncRoute(async (req, res) => {
  const q = z
    .object({
      amountTon: z.coerce.number().positive()
    })
    .parse(req.query);

  const { apy, tonUsd } = await getMarket();
  const amountTon = q.amountTon;
  const monthlyYieldUsd = amountTon * (apy / 12) * tonUsd;

  res.json({ amountTon, monthlyYieldUsd, apy, tonUsd });
}));

app.post("/convert/ton-estimate", asyncRoute(async (req, res) => {
  const body = z
    .object({
      amount: z.number().positive(),
      token: z.string().min(1)
    })
    .parse(req.body);

  try {
    const result = await convertToTON(body.amount, body.token);
    res.json({ ok: true, ...result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not estimate conversion via STON.fi.";
    res.status(200).json({
      ok: false,
      error: message,
      tonAmount: null as number | null,
      usedStonFi: false
    });
  }
}));

app.get("/coverage", asyncRoute(async (req, res) => {
  const q = z
    .object({
      amountTon: z.coerce.number().positive(),
      subscriptionId: z.enum(["netflix", "spotify", "amazon", "telegram_premium"])
    })
    .parse(req.query);

  const sub = SUBSCRIPTIONS.find((s) => s.id === q.subscriptionId)!;
  const { apy, tonUsd } = await getMarket();
  const monthlyYieldUsd = q.amountTon * (apy / 12) * tonUsd;
  const coveragePct = sub.monthlyUsd > 0 ? (monthlyYieldUsd / sub.monthlyUsd) * 100 : 0;

  res.json({
    amountTon: q.amountTon,
    subscriptionId: q.subscriptionId,
    subscriptionCostUsd: sub.monthlyUsd,
    monthlyYieldUsd,
    coveragePct,
    apy,
    tonUsd
  });
}));

app.get("/wallet/balance", asyncRoute(async (req, res) => {
  const q = z
    .object({
      walletAddress: z.string().min(1)
    })
    .parse(req.query);

  const cachedBalance = balanceCache.get(q.walletAddress);
  if (cachedBalance && Date.now() - cachedBalance.cachedAt < BALANCE_CACHE_TTL_MS) {
    res.json({
      walletAddress: q.walletAddress,
      balanceTon: cachedBalance.balanceTon
    });
    return;
  }

  let parsed: Address | null = null;
  try {
    parsed = Address.parse(q.walletAddress);
  } catch {
    parsed = null;
  }

  const candidates = [
    q.walletAddress,
    parsed?.toRawString(),
    parsed?.toString({ bounceable: true, testOnly: false, urlSafe: true }),
    parsed?.toString({ bounceable: false, testOnly: false, urlSafe: true })
  ].filter((v): v is string => Boolean(v));

  let account: { balance?: number | string } | null = null;
  for (const addr of candidates) {
    const response = await withRetryOn429(() =>
      runWithTonApiRateLimit(() =>
        fetch(`https://tonapi.io/v2/accounts/${encodeURIComponent(addr)}`)
      )
    );
    if (!response.ok) continue;
    account = (await response.json()) as { balance?: number | string };
    break;
  }

  if (!account) {
    res.json({
      walletAddress: q.walletAddress,
      balanceTon: 0
    });
    return;
  }

  const balanceTon = normalizeTonFromNano(account.balance ?? 0, "wallet_ton_balance");
  balanceCache.set(q.walletAddress, { balanceTon, cachedAt: Date.now() });

  res.json({
    walletAddress: q.walletAddress,
    balanceTon
  });
}));

app.get("/wallet/staking", asyncRoute(async (req, res) => {
  const q = z
    .object({
      walletAddress: z.string().min(1),
      subscriptionId: z.enum(["netflix", "spotify", "amazon", "telegram_premium"]).optional()
    })
    .parse(req.query);

  const stakedAmountTon = await getOnchainStakedTon(q.walletAddress);
  const { apy, tonUsd, tsTonTon } = await getMarket();
  const monthlyYieldUsd = stakedAmountTon * (apy / 12) * tonUsd;
  const sub = SUBSCRIPTIONS.find((s) => s.id === (q.subscriptionId ?? "netflix"))!;
  const coveragePct = sub.monthlyUsd > 0 ? (monthlyYieldUsd / sub.monthlyUsd) * 100 : 0;

  res.json({
    walletAddress: q.walletAddress,
    stakedAmountTon,
    tsTonTon,
    monthlyYieldUsd,
    coveragePct,
    apy,
    tonUsd
  });
}));

app.post("/stake/tx", asyncRoute(async (req, res) => {
  const body = z
    .object({
      amountTon: z.number().positive(),
      walletAddress: z.string().min(1)
    })
    .parse(req.body);

  const tx = await buildStakeTransaction(body.amountTon, body.walletAddress);
  res.json({
    amountTon: body.amountTon,
    walletAddress: body.walletAddress,
    transaction: tx
  });
}));

app.post("/unstake/tx", asyncRoute(async (req, res) => {
  const body = z
    .object({
      amountTon: z.number().positive(),
      walletAddress: z.string().min(1)
    })
    .parse(req.body);

  const tx = await buildUnstakeTransaction(body.amountTon, body.walletAddress);
  res.json({
    amountTon: body.amountTon,
    walletAddress: body.walletAddress,
    transaction: tx
  });
}));

app.post("/squad/create", (req, res) => {
  const body = z
    .object({
      subscriptionId: z.enum(["netflix", "spotify", "amazon", "telegram_premium"]),
      members: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            contributionTon: z.number().nonnegative()
          })
        )
        .length(4)
    })
    .parse(req.body);

  const id = uid("squad");
  const squad = { id, subscriptionId: body.subscriptionId, members: body.members };
  memory.squads.set(id, squad);
  res.json(squad);
});

app.get("/squad/:id", (req, res) => {
  const id = req.params.id;
  const squad = memory.squads.get(id);
  if (!squad) return res.status(404).json({ error: "not found" });
  res.json(squad);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: "invalid_request", details: err.issues });
  }
  const message = err instanceof Error ? err.message : "internal_error";
  return res.status(500).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`[backend] listening on :${PORT}`);
});

