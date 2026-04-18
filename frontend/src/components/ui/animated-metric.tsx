"use client";

import { useAnimatedNumber } from "@/hooks/use-animated-number";
import { formatTonAdaptive, formatUsdAdaptive } from "@/lib/format";
import { cn } from "@/lib/utils";

type AnimatedMetricProps = {
  value: number;
  className?: string;
};

/** Count-up TON display — formatting matches formatTonAdaptive at each frame. */
export function AnimatedTon({ value, className }: AnimatedMetricProps) {
  const d = useAnimatedNumber(value);
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {formatTonAdaptive(d)} TON
    </span>
  );
}

/** Count-up USD display. */
export function AnimatedUsd({ value, className }: AnimatedMetricProps) {
  const d = useAnimatedNumber(value);
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {formatUsdAdaptive(d)}
    </span>
  );
}

type AnimatedPercentProps = AnimatedMetricProps & {
  /** Decimal places for the numeric part (e.g. 1 for coverage stat, 2 for APY). */
  decimals?: number;
  suffix?: string;
};

export function AnimatedPercent({
  value,
  decimals = 1,
  suffix = "%",
  className
}: AnimatedPercentProps) {
  const capped = Math.min(Math.max(value, 0), 9999);
  const d = useAnimatedNumber(capped);
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {d.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Integer percent (hero / ring). */
export function AnimatedPercentInt({ value, className }: AnimatedMetricProps) {
  const capped = Math.min(Math.max(value, 0), 999);
  const d = useAnimatedNumber(capped);
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {Math.round(d)}%
    </span>
  );
}
