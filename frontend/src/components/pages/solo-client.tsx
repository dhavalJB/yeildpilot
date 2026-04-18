"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Circle, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { getSubscriptionById, type SubscriptionId } from "@/lib/subscriptions";
import { api } from "@/lib/api";
import { useTonConnect } from "@/lib/use-ton-connect";
import { mapTransactionError } from "@/lib/transaction-errors";
import { formatTonAdaptive, formatUsdAdaptive } from "@/lib/format";
import { SoloPageSkeleton } from "@/components/page-skeletons";
import { AnimatedPercent, AnimatedUsd } from "@/components/ui/animated-metric";
import { SoloRouteSummary } from "@/components/solo/solo-route-summary";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/telegram-haptics";

function shortJettonLabel(addr: string) {
  const t = addr.trim();
  if (!t) return "Token";
  if (t.length <= 12) return t;
  return `${t.slice(0, 4)}…${t.slice(-4)}`;
}

type TxState = "idle" | "signing" | "pending" | "success" | "error";
type ToastTone = "success" | "error" | "info";
type ToastState = { tone: ToastTone; message: string } | null;

export function SoloClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const subscriptionId = (sp.get("subscription") ?? "netflix") as SubscriptionId;
  const sub = getSubscriptionById(subscriptionId);

  const {
    market,
    solo,
    walletAddress: storedWalletAddress,
    setAssignedSubscription,
    setStakingResult,
    refreshOnchainStake
  } =
    useAppStore();
  const { walletAddress, isConnected, sendTransaction } = useTonConnect();

  const [stakeInput, setStakeInput] = useState<string>(String(solo.stakeTon || 300));
  const [jettonMaster, setJettonMaster] = useState("");
  const [stonMeta, setStonMeta] = useState<{ tonAmount: number; usedStonFi: boolean } | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [txState, setTxState] = useState<TxState>("idle");
  const [txMessage, setTxMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  const stake = useMemo(() => {
    const parsed = Number(stakeInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [stakeInput]);
  const useJetton = jettonMaster.trim().length > 0;
  const isBusy = txState === "signing" || txState === "pending";

  const stakeTonEffective = useMemo(() => {
    if (useJetton) {
      return stonMeta && stonMeta.tonAmount > 0 ? stonMeta.tonAmount : 0;
    }
    return stake;
  }, [useJetton, stonMeta, stake]);

  useEffect(() => {
    if (!useJetton || stake <= 0) {
      setStonMeta(null);
      setEstimateError(null);
      setEstimateLoading(false);
      return;
    }
    setEstimateLoading(true);
    const id = setTimeout(() => {
      void (async () => {
        try {
          const r = await api.convertTonEstimate({
            amount: stake,
            token: jettonMaster.trim()
          });
          if (r.ok) {
            setStonMeta({ tonAmount: r.tonAmount, usedStonFi: r.usedStonFi });
            setEstimateError(null);
          } else {
            setStonMeta(null);
            setEstimateError(r.error ?? "Conversion estimate unavailable.");
          }
        } catch {
          setStonMeta(null);
          setEstimateError("Could not reach STON.fi estimate. Use native TON or try again.");
        } finally {
          setEstimateLoading(false);
        }
      })();
    }, 450);
    return () => {
      clearTimeout(id);
      setEstimateLoading(false);
    };
  }, [useJetton, stake, jettonMaster]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    setAssignedSubscription(subscriptionId);
  }, [subscriptionId, setAssignedSubscription]);

  const requiredTon = useMemo(() => {
    const denom = (market.apy / 12) * market.tonUsd;
    return denom > 0 ? sub.monthlyUsd / denom : 0;
  }, [market.apy, market.tonUsd, sub.monthlyUsd]);

  const estYieldUsd = useMemo(() => {
    return stakeTonEffective * (market.apy / 12) * market.tonUsd;
  }, [stakeTonEffective, market.apy, market.tonUsd]);

  const coverage = useMemo(() => {
    return sub.monthlyUsd > 0 ? (estYieldUsd / sub.monthlyUsd) * 100 : 0;
  }, [estYieldUsd, sub.monthlyUsd]);

  if (market.lastUpdatedAt === null) {
    return <SoloPageSkeleton />;
  }

  const fadeContainer = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.065, delayChildren: 0.02 }
    }
  };
  const fadeItem = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const }
    }
  };

  const summaryEstimating =
    useJetton && (estimateLoading || (!stonMeta && !estimateError && stake > 0));

  return (
    <motion.div
      className="space-y-6 pb-2"
      variants={fadeContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div className="px-1" variants={fadeItem}>
        <div className="text-3xl font-bold tracking-tight">Solo</div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-muted-foreground">
          <span>
            Stake for{" "}
            <span className="font-semibold" style={{ color: sub.color }}>
              {sub.name}
            </span>{" "}
            and track your monthly coverage.
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Powered by STON.fi
          </span>
        </div>
      </motion.div>

      <motion.div variants={fadeItem}>
      <Card className="glass premium-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Live APY</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              <AnimatedPercent value={market.apy * 100} decimals={2} className="inline" />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              APY source:{" "}
              <span className="font-semibold tabular-nums text-foreground">Tonstakers</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              TON/USD price:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {formatUsdAdaptive(market.tonUsd)}
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
            <Sparkles className="size-4 text-ton-400" />
            Premium yield estimate
          </div>
        </div>
      </Card>
      </motion.div>

      {/* A. Input Card */}
      <motion.div variants={fadeItem}>
      <Card className="glass premium-card p-6">
        <div className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Stake amount
        </div>
        <div className="space-y-2">
          <label className="block text-[11px] text-muted-foreground">
            Jetton master (optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty for native TON"
            value={jettonMaster}
            onChange={(e) => setJettonMaster(e.target.value)}
            className="input-premium w-full px-3 py-2 font-mono text-xs"
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">
              {useJetton ? "Jetton amount" : "TON amount"}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {useJetton ? (
                <>
                  {formatTonAdaptive(stake)}{" "}
                  <span className="text-lg font-semibold text-muted-foreground">jetton</span>
                </>
              ) : (
                <>
                  {formatTonAdaptive(stake)} TON
                </>
              )}
            </div>
            {useJetton && stonMeta && stonMeta.usedStonFi ? (
              <p className="mt-2 text-xs font-medium leading-snug text-emerald-400/95">
                Automatically converted to TON via STON.fi — ≈{" "}
                <span className="tabular-nums font-semibold text-emerald-300">
                  {formatTonAdaptive(stonMeta.tonAmount)} TON
                </span>{" "}
                (estimate)
              </p>
            ) : null}
            {useJetton && estimateError ? (
              <p className="mt-2 text-xs leading-snug text-amber-200/90">{estimateError}</p>
            ) : null}
            <div className="mt-2 text-xs text-muted-foreground">
              Est. for 100% coverage:{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {requiredTon.toFixed(0)} TON
              </span>
            </div>
          </div>
          <div className="w-28 shrink-0">
            <div className="text-[11px] text-muted-foreground">{useJetton ? "Units" : "TON"}</div>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={stakeInput}
              onChange={(e) => setStakeInput(e.target.value)}
              className="input-premium mt-1 w-full px-3 py-2 text-right text-sm font-semibold tabular-nums"
            />
          </div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          {useJetton
            ? "STON.fi estimates how much TON you would receive for this jetton amount. Staking still uses native TON — fund your wallet accordingly, or stake TON directly."
            : "Enter any TON amount. You can start from as low as 0.01 TON."}
        </div>
      </Card>
      </motion.div>

      {/* B. Result Card */}
      <motion.div variants={fadeItem}>
      <Card className="glass premium-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Monthly Yield</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              <AnimatedUsd value={estYieldUsd} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Coverage</div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              <AnimatedPercent value={Math.min(coverage, 999)} decimals={0} suffix="%" />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={Math.min(coverage, 100)} />
          <div className="mt-2 text-xs text-muted-foreground">
            Coverage = (monthly yield / subscription cost) × 100
          </div>
        </div>
      </Card>
      </motion.div>

      {stake > 0 ? (
        <motion.div variants={fadeItem}>
          <SoloRouteSummary
            payLabel={useJetton ? "jetton" : "TON"}
            payAmount={stake}
            receiveTon={!useJetton ? stake : stonMeta?.tonAmount ?? 0}
            routeLine={
              useJetton
                ? `${shortJettonLabel(jettonMaster)} → TON via STON.fi`
                : "Native TON"
            }
            showStonDetails={useJetton}
            estimating={summaryEstimating}
            estimateFailed={useJetton && !!estimateError}
          />
        </motion.div>
      ) : null}

      {stake > 0 ? (
        <motion.div variants={fadeItem}>
          <div className="rounded-2xl border border-border/70 bg-muted/25 p-4 dark:border-white/10 dark:bg-white/[0.04]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Your path to yield
            </div>
            {useJetton && stonMeta ? (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2.5 text-sm leading-snug">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-emerald-500"
                    aria-hidden
                  />
                  <span>
                    <span className="font-semibold text-foreground">Quote ready</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — STON.fi estimate (plan your TON; swap is not sent from this app)
                    </span>
                  </span>
                </div>
                <div className="flex gap-2.5 text-sm leading-snug">
                  <Circle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  <span>
                    <span className="font-semibold text-foreground">Stake</span>
                    <span className="text-muted-foreground">
                      {" "}
                      — confirm once in your wallet (Tonstakers)
                    </span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex gap-2.5 text-sm leading-snug">
                <Circle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="font-semibold text-foreground">Stake</span>
                  <span className="text-muted-foreground">
                    {" "}
                    — confirm once in your wallet (Tonstakers)
                  </span>
                </span>
              </div>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              This requires <span className="font-semibold text-foreground">one wallet confirmation</span> to
              complete staking. Hold enough native TON for the stake amount and network fee.
            </p>
          </div>
        </motion.div>
      ) : null}

      {/* C. CTA */}
      <motion.div variants={fadeItem}>
      <Button
        className="w-full rounded-2xl shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_20px_60px_rgba(79,140,255,0.22)]"
        size="lg"
        loading={isBusy}
        loadingLabel={txState === "signing" ? "Confirm in wallet…" : "Starting your yield…"}
        disabled={
          isBusy ||
          stakeTonEffective <= 0 ||
          (useJetton && (!stonMeta || estimateError !== null))
        }
        onClick={async () => {
          setTxState("idle");
          setTxMessage(null);
          if (stake <= 0) {
            hapticError();
            setTxState("error");
            setTxMessage("Please enter a valid amount.");
            setToast({ tone: "error", message: "Please enter a valid amount." });
            return;
          }
          if (useJetton && (!stonMeta || stonMeta.tonAmount <= 0)) {
            hapticError();
            setTxState("error");
            setTxMessage("Wait for a STON.fi estimate or clear the jetton field to stake TON only.");
            setToast({ tone: "error", message: "Conversion estimate required before staking." });
            return;
          }
          if (!isConnected || !walletAddress) {
            hapticError();
            setTxState("error");
            setTxMessage("Wallet not connected. Please connect your wallet.");
            setToast({
              tone: "error",
              message: "Wallet not connected. Please connect your wallet."
            });
            setStakingResult({
              monthlyYieldUsd: 0,
              coveragePct: 0,
              status: "error",
              message: "Wallet not connected"
            });
            return;
          }

          hapticTap();
          setTxState("signing");
          setTxMessage("Confirm in your wallet to stake with Tonstakers.");
          setToast({ tone: "info", message: "Confirm in your wallet…" });
          try {
            const tonToStake = stakeTonEffective;
            const { transaction } = await api.stakeTx({
              amountTon: tonToStake,
              walletAddress: walletAddress || storedWalletAddress || ""
            });

            await sendTransaction(transaction);
            setTxState("pending");
            setTxMessage("Starting your yield…");
            setToast({ tone: "info", message: "Starting your yield…" });

            const [yieldData, coverageData] = await Promise.all([
              api.yield(tonToStake),
              api.coverage(tonToStake, subscriptionId)
            ]);

            setAssignedSubscription(subscriptionId);
            await refreshOnchainStake(walletAddress, subscriptionId);
            setStakingResult({
              monthlyYieldUsd: yieldData.monthlyYieldUsd,
              coveragePct: coverageData.coveragePct,
              status: "success",
              message: "You're now earning 🎉"
            });
            setTxState("success");
            setTxMessage("You're now earning 🎉");
            setToast({ tone: "success", message: "You're now earning 🎉" });
            hapticSuccess();
            setTimeout(() => {
              setTxState("idle");
              setTxMessage(null);
            }, 2200);
            router.push("/");
          } catch (e) {
            const msg = mapTransactionError(e);
            hapticError();
            setTxState("error");
            setTxMessage(msg);
            setToast({ tone: "error", message: msg });
            setStakingResult({
              monthlyYieldUsd: 0,
              coveragePct: 0,
              status: "error",
              message: msg
            });
          }
        }}
      >
        {txState === "signing"
          ? "Confirm in wallet…"
          : txState === "pending"
            ? "Starting your yield…"
            : "Start Earning"}{" "}
        {!isBusy ? <ArrowRight className="ml-2 size-4" /> : null}
      </Button>
      <div
        className={`rounded-xl border px-3 py-2 text-sm ${
          txState === "error"
            ? "border-red-400/30 bg-red-500/10 text-red-300 dark:text-red-200"
            : txState === "success"
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-border/80 bg-muted/40 text-muted-foreground dark:border-white/10 dark:bg-white/5"
        }`}
      >
        {txMessage ??
          (txState === "idle"
            ? "Ready to stake."
            : txState === "signing"
              ? "Confirm in your wallet to stake with Tonstakers."
              : txState === "pending"
                ? "Starting your yield…"
                : txState === "success"
                  ? "You're now earning 🎉"
                  : "Something went wrong. Please try again")}
      </div>
      {txState === "error" ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            hapticTap();
            setTxState("idle");
            setTxMessage(null);
          }}
        >
          Retry
        </Button>
      ) : null}
      {toast ? (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed left-1/2 top-5 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-xl ${
            toast.tone === "success"
              ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
              : toast.tone === "error"
                ? "border-red-400/30 bg-red-500/20 text-red-100"
                : "border-white/15 bg-slate-900/85 text-slate-100"
          }`}
        >
          {toast.message}
        </motion.div>
      ) : null}
      </motion.div>
    </motion.div>
  );
}

