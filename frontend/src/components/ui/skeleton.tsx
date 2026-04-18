"use client";

import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-white/10", className)}
      {...props}
    />
  );
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-3/4", className)} />;
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("glass space-y-3 rounded-2xl p-5", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-40" />
      <Skeleton className="h-3 w-full max-w-[200px]" />
    </div>
  );
}

export function SkeletonProgressRow() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-2 w-full rounded-full" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
