"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Progress({
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-3 w-full overflow-hidden rounded-full border border-border/80 bg-muted/60 dark:border-white/10 dark:bg-black/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator asChild>
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-emerald-400 shadow-[0_0_22px_rgba(79,140,255,0.4)]"
          initial={{ width: "0%" }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
        />
      </ProgressPrimitive.Indicator>
    </ProgressPrimitive.Root>
  );
}

