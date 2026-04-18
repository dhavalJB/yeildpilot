"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "size-3",
  md: "size-4",
  lg: "size-8"
};

export function Spinner({
  className,
  size = "md"
}: {
  className?: string;
  size?: keyof typeof sizeMap;
}) {
  return (
    <Loader2
      className={cn("animate-spin text-ton-400", sizeMap[size], className)}
      aria-hidden
    />
  );
}

export function SpinnerCentered({
  label = "Loading…",
  size = "lg"
}: {
  label?: string;
  size?: keyof typeof sizeMap;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <Spinner size={size} className="text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
