"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "premium-card rounded-2xl border border-border/60 bg-card text-card-foreground shadow-glow",
        className
      )}
      {...props}
    />
  );
}

