"use client";

import { motion } from "framer-motion";
import { formatTonAdaptive } from "@/lib/format";
import { StonfiFeeInfoDialog } from "@/components/solo/stonfi-fee-info-dialog";

const TYPICAL_COMBINED_FEE_PCT = 0.3;
const MAX_ROUTE_FEE_PCT = 1;

type SoloRouteSummaryProps = {
  payLabel: string;
  payAmount: number;
  receiveTon: number;
  routeLine: string;
  showStonDetails: boolean;
  estimating?: boolean;
  /** Jetton path: estimate failed — hide receive amount */
  estimateFailed?: boolean;
};

export function SoloRouteSummary({
  payLabel,
  payAmount,
  receiveTon,
  routeLine,
  showStonDetails,
  estimating,
  estimateFailed
}: SoloRouteSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border/70 bg-gradient-to-br from-card/90 to-muted/30 p-4 shadow-sm dark:border-white/10 dark:from-white/[0.06] dark:to-transparent dark:shadow-none"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Before you confirm
        </div>
        {showStonDetails ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
              STON.fi
            </span>
            <StonfiFeeInfoDialog />
          </div>
        ) : null}
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-muted-foreground">You pay</dt>
          <dd className="text-right font-semibold tabular-nums text-foreground">
            {estimating ? (
              <span className="text-muted-foreground">…</span>
            ) : (
              <>
                {formatTonAdaptive(payAmount)} <span className="font-medium text-muted-foreground">{payLabel}</span>
              </>
            )}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 dark:border-white/10">
          <dt className="text-muted-foreground">You receive (est.)</dt>
          <dd className="text-right font-semibold tabular-nums text-emerald-600 dark:text-emerald-300">
            {estimateFailed ? (
              <span className="text-amber-600 dark:text-amber-200/90">Unavailable</span>
            ) : estimating ? (
              <span className="text-muted-foreground">…</span>
            ) : (
              <>{formatTonAdaptive(receiveTon)} TON</>
            )}
          </dd>
        </div>
        {showStonDetails ? (
          <>
            <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 dark:border-white/10">
              <dt className="text-muted-foreground">
                Total fees
                <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground/85">
                  Includes swap + platform fee
                </span>
              </dt>
              <dd className="text-right">
                <span className="font-semibold tabular-nums text-foreground">
                  ≈{TYPICAL_COMBINED_FEE_PCT}% typical
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  up to ~{MAX_ROUTE_FEE_PCT}% route
                </span>
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 dark:border-white/10">
              <dt className="text-muted-foreground">Network fee</dt>
              <dd className="text-right text-sm font-medium tabular-nums text-foreground">~0.05–0.08 TON</dd>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-[11px] leading-snug text-muted-foreground dark:border-white/10 dark:bg-black/20">
              <span className="font-medium text-foreground">Route:</span> {routeLine}
            </div>
          </>
        ) : (
          <div className="flex items-start justify-between gap-3 border-t border-border/50 pt-3 dark:border-white/10">
            <dt className="text-muted-foreground">Network fee</dt>
            <dd className="text-right text-sm font-medium tabular-nums text-foreground">~0.05–0.08 TON</dd>
          </div>
        )}
      </dl>

      {showStonDetails ? (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Final amount may vary due to market conditions. This app shows a STON.fi quote; on-chain swap is not sent from
          here — fund your wallet with the estimated TON before staking.
        </p>
      ) : (
        <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
          Staking uses native TON. Typical network fee ~0.05–0.08 TON (varies).
        </p>
      )}
    </motion.div>
  );
}
