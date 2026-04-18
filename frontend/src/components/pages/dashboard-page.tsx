"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, Layers, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { getSubscriptionById } from "@/lib/subscriptions";
import { formatTonAdaptive, formatUsdAdaptive } from "@/lib/format";
import { useTonConnect } from "@/lib/use-ton-connect";
import { api } from "@/lib/api";
import { mapTransactionError } from "@/lib/transaction-errors";
import { DashboardPageSkeleton } from "@/components/page-skeletons";
import { DashboardOnboarding } from "@/components/onboarding/dashboard-onboarding";
import { CoverageRing } from "@/components/dashboard/coverage-ring";
import { hapticError, hapticSuccess, hapticTap } from "@/lib/telegram-haptics";
import {
  AnimatedPercent,
  AnimatedPercentInt,
  AnimatedTon,
  AnimatedUsd
} from "@/components/ui/animated-metric";

type TxState = "idle" | "signing" | "pending" | "success" | "error";
type ToastTone = "success" | "error" | "info";
type ToastState = { tone: ToastTone; message: string } | null;

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const {
    market,
    solo,
    assignedSubscriptionId,
    stakingResult,
    refreshOnchainStake,
    stakingSyncing,
    usingCachedMarketData,
    usingCachedStakeData
  } = useAppStore();
  const { walletAddress, isConnected, sendTransaction } = useTonConnect();
  const [withdrawState, setWithdrawState] = useState<TxState>("idle");
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawInput, setWithdrawInput] = useState("");
  const [withdrawValidation, setWithdrawValidation] = useState<string | null>(null);
  const sub = getSubscriptionById(assignedSubscriptionId || "netflix");

  const totalStakedTon = solo.stakeTon;
  const monthlyYieldUsd = useMemo(() => {
    return totalStakedTon * (market.apy / 12) * market.tonUsd;
  }, [totalStakedTon, market.apy, market.tonUsd]);

  const coverage = useMemo(() => {
    return stakingResult.status === "success"
      ? stakingResult.coveragePct
      : sub.monthlyUsd > 0
        ? (monthlyYieldUsd / sub.monthlyUsd) * 100
        : 0;
  }, [stakingResult.status, stakingResult.coveragePct, sub.monthlyUsd, monthlyYieldUsd]);
  const withdrawBusy = withdrawState === "signing" || withdrawState === "pending";
  const availableToWithdrawTon = solo.stakeTon;
  const withdrawAmountTon = useMemo(() => {
    const parsed = Number(withdrawInput);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [withdrawInput]);

  const displayMonthlyYieldUsd =
    stakingResult.status === "success"
      ? stakingResult.monthlyYieldUsd
      : monthlyYieldUsd;
  const coveredUsd = Math.min(displayMonthlyYieldUsd, sub.monthlyUsd);
  const remainingUsd = Math.max(0, sub.monthlyUsd - displayMonthlyYieldUsd);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(id);
  }, [toast]);

  const pageBootstrapping =
    market.lastUpdatedAt === null || (isConnected && stakingSyncing);

  if (pageBootstrapping) {
    return <DashboardPageSkeleton />;
  }

  const coverageHero = Math.min(coverage, 999);

  return (
    <div className="space-y-7 pb-6">
      <DashboardOnboarding />
      <motion.header
        className="px-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Overview
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Yield, coverage, and cash movement in one glance.
        </p>
      </motion.header>

      {usingCachedMarketData || usingCachedStakeData ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-900/90 dark:border-amber-400/25 dark:bg-amber-500/10 dark:text-amber-100/90"
          role="status"
        >
          Using last updated data
        </motion.div>
      ) : null}

      {/* HERO */}
      <motion.section
        variants={fadeUp}
        initial="initial"
        animate="animate"
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <Card
          data-tour="coverage-hero"
          className="glass premium-card relative overflow-hidden border-slate-200/80 bg-gradient-to-br from-white via-slate-50/90 to-primary/[0.08] p-6 shadow-lg shadow-slate-900/5 dark:border-white/10 dark:from-slate-950/90 dark:via-slate-900/70 dark:to-primary/[0.12] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_24px_80px_rgba(15,23,42,0.55)] sm:p-8"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl dark:bg-primary/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/10"
            aria-hidden
          />

          <div className="relative text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Active plan
            </p>
            <div className="mt-3 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
              <motion.span
                className="inline-block text-5xl font-extrabold tabular-nums tracking-tight sm:text-6xl"
                animate={{ opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <AnimatedPercentInt
                  value={coverage}
                  className="bg-gradient-to-r from-slate-900 via-primary to-accent bg-clip-text text-transparent dark:from-white dark:via-white dark:to-white/75"
                />
              </motion.span>
              <span className="text-2xl font-bold tracking-tight text-muted-foreground sm:text-3xl">
                COVERED
              </span>
            </div>
            <p className="mt-3 text-base font-semibold sm:text-lg" style={{ color: sub.color }}>
              {sub.name}
            </p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Your yield is funding this subscription
            </p>
            {stakingResult.message ? (
              <div
                className={`mt-3 text-xs ${
                  stakingResult.status === "error" ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {stakingResult.message}
              </div>
            ) : null}
          </div>

          <div className="relative mt-8">
            <div className="relative h-4 w-full overflow-hidden rounded-full border border-slate-200/90 bg-slate-100 shadow-inner dark:border-white/10 dark:bg-black/30">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-emerald-400 shadow-[0_0_28px_rgba(34,197,94,0.35)]"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(coverage, 100)}%` }}
                transition={{ duration: 0.78, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>$0</span>
              <span>{formatUsdAdaptive(sub.monthlyUsd)} / month</span>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Donut + stats */}
      <div className="grid gap-4 lg:grid-cols-12 lg:items-stretch">
        <motion.div
          className="lg:col-span-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.35 }}
        >
          <Card className="glass premium-card flex h-full flex-col items-center justify-center border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 px-4 py-8 shadow-sm dark:border-white/10 dark:from-white/[0.04] dark:to-transparent dark:shadow-none sm:py-10">
            <CoverageRing percent={coverage} className="mx-auto" />
            <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Subscription Coverage
            </p>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-7 lg:grid-cols-2">
          {[
            {
              label: "Total Invested",
              delay: 0.08,
              node: (
                <AnimatedTon
                  value={totalStakedTon}
                  className="text-2xl font-bold text-foreground sm:text-[1.65rem]"
                />
              )
            },
            {
              label: "Monthly Yield",
              delay: 0.1,
              node: (
                <AnimatedUsd
                  value={displayMonthlyYieldUsd}
                  className="text-2xl font-bold text-foreground sm:text-[1.65rem]"
                />
              )
            },
            {
              label: "Current APY",
              delay: 0.12,
              node: (
                <AnimatedPercent
                  value={market.apy * 100}
                  decimals={2}
                  className="text-2xl font-bold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]"
                />
              )
            },
            {
              label: "Coverage",
              delay: 0.14,
              node: (
                <AnimatedPercent
                  value={coverageHero}
                  decimals={1}
                  className="text-2xl font-bold text-foreground sm:text-[1.65rem]"
                />
              )
            }
          ].map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: item.delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                className="glass premium-card h-full border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none sm:p-6"
                data-tour={
                  item.label === "Total Invested"
                    ? "total-invested"
                    : item.label === "Monthly Yield"
                      ? "monthly-yield"
                      : undefined
                }
              >
                <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </div>
                <div className="mt-3">{item.node}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Subscription details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.35 }}
      >
        <Card
          data-tour="subscription-section"
          className="glass premium-card border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-white/10 dark:bg-gradient-to-br dark:from-white/[0.05] dark:to-transparent dark:shadow-none sm:p-7"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Subscription
              </div>
              <div className="mt-1 text-lg font-bold" style={{ color: sub.color }}>
                {sub.name}
              </div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Monthly billing
            </div>
          </div>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-white/5 dark:bg-black/20">
              <dt className="text-[11px] font-medium text-muted-foreground">Monthly cost</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums">
                {formatUsdAdaptive(sub.monthlyUsd)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-white/5 dark:bg-black/20">
              <dt className="text-[11px] font-medium text-muted-foreground">Covered amount</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-400">
                <AnimatedUsd value={coveredUsd} />
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 sm:col-span-1 dark:border-white/5 dark:bg-black/20">
              <dt className="text-[11px] font-medium text-muted-foreground">Remaining</dt>
              <dd className="mt-1 text-lg font-bold tabular-nums text-foreground">
                <AnimatedUsd value={remainingUsd} />
              </dd>
            </div>
          </dl>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.35 }}
      >
        <Button
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-primary to-accent text-base font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.1)_inset,0_20px_60px_rgba(79,140,255,0.28)]"
          size="lg"
          asChild
        >
          <Link href="/solo" data-tour="add-investment" onClick={() => hapticTap()}>
            <TrendingUp className="mr-2 size-5" />
            Add / Increase Investment
          </Link>
        </Button>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            variant="secondary"
            className="h-14 w-full rounded-2xl border-white/15 bg-white/10 text-base font-semibold shadow-[0_12px_40px_rgba(0,0,0,0.35)] hover:bg-white/[0.14]"
            size="lg"
            asChild
          >
            <Link href="/subscriptions" onClick={() => hapticTap()}>
              <Layers className="mr-2 size-5" />
              Change Subscription
            </Link>
          </Button>
          <Button
            data-tour="withdraw-action"
            className="h-14 w-full rounded-2xl bg-gradient-to-r from-slate-700/90 to-slate-800/90 text-base font-semibold shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset]"
            size="lg"
            disabled={withdrawBusy || availableToWithdrawTon <= 0}
            onClick={() => {
              hapticTap();
              setWithdrawValidation(null);
              setWithdrawInput(
                availableToWithdrawTon > 0 ? String(Number(availableToWithdrawTon.toFixed(6))) : ""
              );
              setWithdrawOpen(true);
            }}
          >
            <ArrowDownToLine className="mr-2 size-5" />
            Withdraw
          </Button>
        </div>
      </motion.div>

      {withdrawOpen ? (
        <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass premium-card w-full max-w-md rounded-2xl p-5">
            <div className="text-base font-semibold">Withdraw</div>
            <div className="mt-1 text-xs text-muted-foreground">Network fee applies</div>
            <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-sm">
              <div className="text-xs text-muted-foreground">Available balance</div>
              <div className="mt-1 font-semibold tabular-nums">
                {formatTonAdaptive(availableToWithdrawTon)} TON
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-muted-foreground">Amount to withdraw (TON)</div>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                className="input-premium mt-1 w-full px-3 py-2 text-right text-sm font-semibold tabular-nums"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setWithdrawInput(String(Number((availableToWithdrawTon * 0.25).toFixed(6))))
                }
              >
                25%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setWithdrawInput(String(Number((availableToWithdrawTon * 0.5).toFixed(6))))
                }
              >
                50%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setWithdrawInput(String(Number(availableToWithdrawTon.toFixed(6))))
                }
              >
                MAX
              </Button>
            </div>
            {withdrawValidation ? (
              <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {withdrawValidation}
              </div>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  if (withdrawBusy) return;
                  setWithdrawOpen(false);
                }}
              >
                Close
              </Button>
              <Button
                loading={withdrawBusy}
                loadingLabel="Processing…"
                disabled={withdrawBusy}
                onClick={async () => {
                  setWithdrawValidation(null);
                  setWithdrawState("idle");
                  setWithdrawMessage(null);

                  if (!isConnected || !walletAddress) {
                    const msg = "Wallet not connected. Please connect your wallet.";
                    hapticError();
                    setWithdrawState("error");
                    setWithdrawMessage(msg);
                    setToast({ tone: "error", message: msg });
                    return;
                  }
                  if (withdrawAmountTon <= 0) {
                    setWithdrawValidation("Enter a valid amount.");
                    return;
                  }
                  if (withdrawAmountTon > availableToWithdrawTon) {
                    setWithdrawValidation("Amount exceeds available balance.");
                    return;
                  }

                  hapticTap();
                  setWithdrawState("signing");
                  setWithdrawMessage("Waiting for wallet confirmation...");
                  setToast({ tone: "info", message: "Waiting for wallet confirmation..." });

                  try {
                    const { transaction } = await api.unstakeTx({
                      amountTon: withdrawAmountTon,
                      walletAddress
                    });
                    await sendTransaction(transaction);

                    setWithdrawState("pending");
                    setWithdrawMessage("Processing your transaction...");
                    setToast({ tone: "info", message: "Processing your transaction..." });

                    await refreshOnchainStake(walletAddress, assignedSubscriptionId);

                    setWithdrawState("success");
                    setWithdrawMessage("Withdraw request submitted 🎉");
                    setToast({ tone: "success", message: "Withdraw request submitted 🎉" });
                    hapticSuccess();
                    setWithdrawOpen(false);
                  } catch (e) {
                    const msg = mapTransactionError(e);
                    hapticError();
                    setWithdrawState("error");
                    setWithdrawMessage(msg);
                    setToast({ tone: "error", message: msg });
                  }
                }}
              >
                {withdrawState === "signing"
                  ? "Waiting for wallet confirmation..."
                  : withdrawState === "pending"
                    ? "Processing transaction..."
                    : "Confirm Withdraw"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Card className="glass premium-card border-white/10 bg-white/[0.02] p-5 sm:p-6">
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Withdrawals
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Network fee applies</div>
        <div
          className={`mt-3 rounded-xl border px-3 py-3 text-sm transition-shadow duration-500 ${
            withdrawState === "error"
              ? "border-red-400/30 bg-red-500/10 text-red-300"
              : withdrawState === "success"
                ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300 shadow-[0_0_28px_rgba(34,197,94,0.18)]"
                : "border-white/10 bg-white/5 text-muted-foreground"
          }`}
        >
          {withdrawMessage ??
            (withdrawState === "idle"
              ? "Ready to withdraw."
              : withdrawState === "signing"
                ? "Waiting for wallet confirmation..."
                : withdrawState === "pending"
                  ? "Processing your transaction..."
                  : withdrawState === "success"
                    ? "Withdraw request submitted 🎉"
                    : "Something went wrong. Please try again")}
        </div>
        {withdrawState === "error" ? (
          <Button
            variant="secondary"
            className="mt-3 w-full rounded-xl"
            onClick={() => {
              setWithdrawState("idle");
              setWithdrawMessage(null);
            }}
          >
            Retry
          </Button>
        ) : null}
      </Card>

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
    </div>
  );
}
