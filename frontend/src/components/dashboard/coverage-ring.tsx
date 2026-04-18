"use client";

import { motion } from "framer-motion";
import { AnimatedPercentInt } from "@/components/ui/animated-metric";

type CoverageRingProps = {
  /** Coverage 0–∞; arc caps at 100% visually; center shows actual value. */
  percent: number;
  size?: number;
  stroke?: number;
  className?: string;
};

export function CoverageRing({
  percent,
  size = 180,
  stroke = 14,
  className
}: CoverageRingProps) {
  const display = Number.isFinite(percent) ? percent : 0;
  const arcFill = Math.min(Math.max(display, 0), 100);
  const innerR = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * innerR;
  const dashOffset = c - (arcFill / 100) * c;
  const center = size / 2;
  const id = `covGrad-${size}-${stroke}`;

  return (
    <div className={`relative ${className ?? ""}`} style={{ width: size, height: size }}>
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-primary/15 blur-2xl"
        animate={{ opacity: [0.75, 1, 0.75] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="relative z-[1] drop-shadow-[0_0_28px_rgba(79,140,255,0.35)]"
        aria-hidden
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="55%" stopColor="hsl(var(--accent))" />
            <stop offset="100%" stopColor="hsl(142 76% 45%)" />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          className="stroke-slate-200/90 dark:stroke-white/10"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={innerR}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <circle
          cx={center}
          cy={center}
          r={innerR - stroke - 6}
          className="fill-white/90 backdrop-blur-sm dark:fill-black/28"
        />
      </svg>
      <div
        className="pointer-events-none absolute inset-0 z-[2] flex flex-col items-center justify-center text-center"
        style={{ width: size, height: size }}
      >
        <AnimatedPercentInt
          value={display}
          className="text-3xl font-extrabold text-foreground sm:text-4xl"
        />
        <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          covered
        </span>
      </div>
    </div>
  );
}
